// Helper Functions

function isTouching(a, b){
    var ar = a.radius, br = b.radius;
    var ax1 = a.x, bx1 = b.x, ay1 = a.y, by1 = b.y;
    var ax2 = ax1 + 2*ar, ay2 = ay1 + 2*ar, bx2 = bx1 + 2*br, by2 = by2 + 2*br;
    if(ax2 < bx1 || ay2 < by1 || bx2 < ax1 || by2 < ay1) return false;
    var axc = ax1 + ar, ayc = ay1 + ar, bxc = bx1 + br, byc = by1 + br;
    return sq(bxc - axc) + sq(byc - ayc) < sq(ar + br);
}

function sq(x){
    return x * x; 
}